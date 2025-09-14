"""
Streamlit Cloud Deployment - Urdu to Roman Urdu Neural Machine Translation
Production-ready web application with the optimized model (Perplexity: 9.08)
"""

import streamlit as st
import torch
import torch.nn as nn
import torch.nn.functional as F
import pickle
import os
from collections import defaultdict, Counter
import time
from datetime import datetime

# Page configuration
st.set_page_config(
    page_title="🌍 Urdu ↔ Roman Urdu AI Translator",
    page_icon="🌍",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        color: #1f77b4;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.2rem;
        text-align: center;
        color: #666;
        margin-bottom: 2rem;
    }
    .performance-badge {
        background: linear-gradient(90deg, #4CAF50, #45a049);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: bold;
        display: inline-block;
        margin: 0.5rem;
    }
    .translation-box {
        background-color: #f8f9fa;
        border: 2px solid #e9ecef;
        border-radius: 10px;
        padding: 1.5rem;
        margin: 1rem 0;
    }
    .footer {
        text-align: center;
        color: #666;
        margin-top: 3rem;
        padding: 1rem;
        border-top: 1px solid #eee;
    }
</style>
""", unsafe_allow_html=True)

# ===================================================================
# MODEL CLASSES (Embedded for deployment)
# ===================================================================

class BPETokenizer:
    def __init__(self, vocab_size=2000):
        self.vocab_size = vocab_size
        self.vocab = {}
        self.merges = []
        self.special_tokens = {
            '<pad>': 0,
            '<unk>': 1,
            '<sos>': 2,
            '<eos>': 3
        }

    def get_stats(self, vocab):
        pairs = defaultdict(int)
        for word, freq in vocab.items():
            symbols = word.split()
            for i in range(len(symbols) - 1):
                pairs[symbols[i], symbols[i+1]] += freq
        return pairs

    def merge_vocab(self, pair, v_in):
        v_out = {}
        bigram = ' '.join(pair)
        replacement = ''.join(pair)
        for word in v_in:
            new_word = word.replace(bigram, replacement)
            v_out[new_word] = v_in[word]
        return v_out

    def train(self, texts):
        word_freq = Counter()
        for text in texts:
            words = text.lower().strip().split()
            for word in words:
                spaced_word = ' '.join(word) + ' </w>'
                word_freq[spaced_word] += 1

        vocab = dict(word_freq)
        num_merges = self.vocab_size - len(self.special_tokens)

        for i in range(num_merges):
            pairs = self.get_stats(vocab)
            if not pairs:
                break
            best = max(pairs, key=pairs.get)
            vocab = self.merge_vocab(best, vocab)
            self.merges.append(best)

        self.vocab = dict(self.special_tokens)
        word_tokens = set()
        for word in vocab:
            word_tokens.update(word.split())

        for i, token in enumerate(sorted(word_tokens)):
            if token not in self.vocab:
                self.vocab[token] = len(self.vocab)

        self.id_to_token = {v: k for k, v in self.vocab.items()}

    def encode_word(self, word):
        word = ' '.join(word) + ' </w>'
        for pair in self.merges:
            bigram = ' '.join(pair)
            replacement = ''.join(pair)
            word = word.replace(bigram, replacement)
        return word.split()

    def encode(self, text):
        tokens = []
        words = text.lower().strip().split()
        for word in words:
            word_tokens = self.encode_word(word)
            for token in word_tokens:
                tokens.append(self.vocab.get(token, self.vocab['<unk>']))
        return tokens

    def decode(self, token_ids):
        tokens = []
        for token_id in token_ids:
            if token_id in [self.vocab['<pad>'], self.vocab['<sos>'], self.vocab['<eos>']]:
                continue
            tokens.append(self.id_to_token.get(token_id, '<unk>'))
        text = ''.join(tokens).replace('</w>', ' ').strip()
        return text

    def get_vocab_size(self):
        return len(self.vocab)

    def pad_token_id(self):
        return self.vocab['<pad>']

    def sos_token_id(self):
        return self.vocab['<sos>']

    def eos_token_id(self):
        return self.vocab['<eos>']

    def load(self, filepath):
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
        self.vocab = data['vocab']
        self.merges = data['merges']
        self.vocab_size = data['vocab_size']
        self.special_tokens = data['special_tokens']
        self.id_to_token = {v: k for k, v in self.vocab.items()}

class Attention(nn.Module):
    def __init__(self, hidden_size):
        super(Attention, self).__init__()
        self.hidden_size = hidden_size
        self.attn = nn.Linear(hidden_size + hidden_size * 2, hidden_size)
        self.v = nn.Parameter(torch.rand(hidden_size))

    def forward(self, hidden, encoder_outputs):
        seq_len = encoder_outputs.size(1)
        batch_size = encoder_outputs.size(0)
        hidden = hidden.unsqueeze(1).repeat(1, seq_len, 1)
        concat = torch.cat([hidden, encoder_outputs], dim=2)
        energy = torch.tanh(self.attn(concat))
        energy = energy.permute(0, 2, 1)
        v = self.v.repeat(batch_size, 1).unsqueeze(1)
        attention = torch.bmm(v, energy).squeeze(1)
        return F.softmax(attention, dim=1)

class Seq2SeqModel(nn.Module):
    def __init__(self, src_vocab_size, tgt_vocab_size, embedding_dim=256, hidden_size=256,
                 encoder_layers=1, decoder_layers=2, dropout=0.1,
                 src_pad_token_id=0, tgt_pad_token_id=0, use_attention=True):
        super(Seq2SeqModel, self).__init__()

        self.hidden_size = hidden_size
        self.encoder_layers = encoder_layers
        self.decoder_layers = decoder_layers
        self.use_attention = use_attention

        self.src_embedding = nn.Embedding(src_vocab_size, embedding_dim, padding_idx=src_pad_token_id)
        self.tgt_embedding = nn.Embedding(tgt_vocab_size, embedding_dim, padding_idx=tgt_pad_token_id)

        self.encoder = nn.LSTM(
            embedding_dim, hidden_size,
            num_layers=encoder_layers,
            bidirectional=True,
            dropout=dropout if encoder_layers > 1 else 0,
            batch_first=True
        )

        decoder_input_size = embedding_dim
        if use_attention:
            decoder_input_size += hidden_size * 2
            self.attention = Attention(hidden_size)

        self.decoder = nn.LSTM(
            decoder_input_size, hidden_size,
            num_layers=decoder_layers,
            dropout=dropout if decoder_layers > 1 else 0,
            batch_first=True
        )

        self.output_projection = nn.Linear(hidden_size, tgt_vocab_size)
        self.dropout = nn.Dropout(dropout)

    def forward(self, src, tgt_input, src_lengths=None):
        batch_size = src.size(0)

        # Encode
        src_embedded = self.dropout(self.src_embedding(src))
        encoder_outputs, (hidden, cell) = self.encoder(src_embedded)

        # Initialize decoder hidden state from bidirectional encoder
        encoder_layers = hidden.size(0) // 2
        forward_hidden = hidden[:encoder_layers]
        backward_hidden = hidden[encoder_layers:]
        combined_hidden = forward_hidden + backward_hidden

        if self.decoder_layers <= encoder_layers:
            decoder_hidden = combined_hidden[-self.decoder_layers:].contiguous()
        else:
            decoder_hidden = combined_hidden[-1:].repeat(self.decoder_layers, 1, 1).contiguous()

        forward_cell = cell[:encoder_layers]
        backward_cell = cell[encoder_layers:]
        combined_cell = forward_cell + backward_cell

        if self.decoder_layers <= encoder_layers:
            decoder_cell = combined_cell[-self.decoder_layers:].contiguous()
        else:
            decoder_cell = combined_cell[-1:].repeat(self.decoder_layers, 1, 1).contiguous()

        # Decode
        tgt_embedded = self.dropout(self.tgt_embedding(tgt_input))

        if self.use_attention:
            outputs = []
            input_step = tgt_embedded[:, 0, :].unsqueeze(1)
            hidden_step = decoder_hidden
            cell_step = decoder_cell

            for t in range(tgt_input.size(1)):
                if t > 0:
                    input_step = tgt_embedded[:, t, :].unsqueeze(1)

                context_vector = self._calculate_context(hidden_step[-1], encoder_outputs)
                decoder_input = torch.cat([input_step, context_vector.unsqueeze(1)], dim=2)
                output, (hidden_step, cell_step) = self.decoder(decoder_input, (hidden_step, cell_step))
                outputs.append(output)

            decoder_outputs = torch.cat(outputs, dim=1)
        else:
            decoder_outputs, _ = self.decoder(tgt_embedded, (decoder_hidden, decoder_cell))

        logits = self.output_projection(decoder_outputs)
        return logits

    def _calculate_context(self, hidden, encoder_outputs):
        attn_weights = self.attention(hidden, encoder_outputs)
        context = torch.bmm(attn_weights.unsqueeze(1), encoder_outputs).squeeze(1)
        return context

    def count_parameters(self):
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

# ===================================================================
# TRANSLATION FUNCTIONS
# ===================================================================

@st.cache_resource
def load_model_and_tokenizers():
    """Load the trained model and tokenizers"""
    try:
        # Load tokenizers
        urdu_tokenizer = BPETokenizer()
        roman_tokenizer = BPETokenizer()

        urdu_tokenizer.load('colab_result_data/urdu_tokenizer.pkl')
        roman_tokenizer.load('colab_result_data/roman_tokenizer.pkl')

        # Create model
        model = Seq2SeqModel(
            src_vocab_size=urdu_tokenizer.get_vocab_size(),
            tgt_vocab_size=roman_tokenizer.get_vocab_size(),
            embedding_dim=256,
            hidden_size=256,
            encoder_layers=1,
            decoder_layers=2,
            dropout=0.1,
            src_pad_token_id=urdu_tokenizer.pad_token_id(),
            tgt_pad_token_id=roman_tokenizer.pad_token_id(),
            use_attention=True
        )

        # Load trained weights
        device = torch.device('cpu')  # Streamlit Cloud uses CPU
        model.load_state_dict(torch.load('colab_result_data/final_model.pth', map_location=device))
        model.eval()

        return model, urdu_tokenizer, roman_tokenizer
    except Exception as e:
        st.error(f"Error loading model: {str(e)}")
        return None, None, None

def translate_text(model, urdu_tokenizer, roman_tokenizer, text, max_length=50):
    """Translate Urdu text to Roman Urdu"""
    if not text.strip():
        return ""

    try:
        model.eval()
        with torch.no_grad():
            # Encode input
            src_tokens = urdu_tokenizer.encode(text)
            src_tensor = torch.tensor([src_tokens], dtype=torch.long)

            # Create initial target input (just SOS token)
            tgt_input = torch.tensor([[roman_tokenizer.sos_token_id()]], dtype=torch.long)

            # Generate translation token by token
            for _ in range(max_length):
                # Get model prediction
                logits = model(src_tensor, tgt_input)

                # Get next token
                next_token = torch.argmax(logits[:, -1, :], dim=-1)

                # Check if EOS token
                if next_token.item() == roman_tokenizer.eos_token_id():
                    break

                # Add to target input
                tgt_input = torch.cat([tgt_input, next_token.unsqueeze(0)], dim=1)

            # Decode to text
            predicted_tokens = tgt_input[0].tolist()[1:]  # Remove SOS token
            translation = roman_tokenizer.decode(predicted_tokens)

            return translation

    except Exception as e:
        return f"Translation error: {str(e)}"

# ===================================================================
# STREAMLIT APP
# ===================================================================

def main():
    # Header
    st.markdown('<div class="main-header">🌍 Neural Machine Translation</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Urdu ↔ Roman Urdu AI Translator</div>', unsafe_allow_html=True)

    # Performance badges
    st.markdown("""
    <div style="text-align: center; margin-bottom: 2rem;">
        <span class="performance-badge">🏆 Perplexity: 9.08</span>
        <span class="performance-badge">⚡ GPU Optimized</span>
        <span class="performance-badge">🧠 9.6M Parameters</span>
        <span class="performance-badge">🔬 Systematically Optimized</span>
    </div>
    """, unsafe_allow_html=True)

    # Load model
    with st.spinner("🔄 Loading AI model..."):
        model, urdu_tokenizer, roman_tokenizer = load_model_and_tokenizers()

    if model is None:
        st.error("❌ Failed to load the translation model. Please check the model files.")
        return

    st.success("✅ Neural translation model loaded successfully!")

    # Main translation interface
    st.markdown("### 🔤 Enter Urdu Text to Translate")

    # Input text area
    urdu_text = st.text_area(
        "Urdu Text:",
        placeholder="یہاں اردو متن لکھیں... (Write Urdu text here...)",
        height=120,
        help="Enter the Urdu text you want to translate to Roman Urdu"
    )

    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        translate_button = st.button("🚀 Translate", type="primary", use_container_width=True)

    # Translation results
    if translate_button and urdu_text.strip():
        with st.spinner("🤖 AI is translating..."):
            start_time = time.time()
            translation = translate_text(model, urdu_tokenizer, roman_tokenizer, urdu_text)
            end_time = time.time()

        st.markdown("### 📝 Translation Result")

        # Display translation in a nice box
        st.markdown(f"""
        <div class="translation-box">
            <h4 style="color: #1f77b4; margin-bottom: 1rem;">Roman Urdu Translation:</h4>
            <p style="font-size: 1.2rem; font-weight: bold; color: #333;">{translation}</p>
        </div>
        """, unsafe_allow_html=True)

        # Translation info
        translation_time = (end_time - start_time) * 1000
        st.markdown(f"⏱️ **Translation time:** {translation_time:.1f} ms")
        st.markdown(f"📊 **Input length:** {len(urdu_text.split())} words")
        st.markdown(f"📊 **Output length:** {len(translation.split())} words")

    elif translate_button and not urdu_text.strip():
        st.warning("⚠️ Please enter some Urdu text to translate.")

    # Example texts
    st.markdown("### 💡 Example Texts")

    examples = [
        "سلام علیکم، آپ کیسے ہیں؟",
        "میں اردو سے رومن اردو میں ترجمہ کر سکتا ہوں",
        "یہ ایک بہترین مشین ترجمہ سسٹم ہے",
        "آج موسم بہت اچھا ہے",
        "علم حاصل کرو چاہے تمہیں چین جانا پڑے"
    ]

    cols = st.columns(len(examples))
    for i, example in enumerate(examples):
        with cols[i]:
            if st.button(f"Try Example {i+1}", key=f"example_{i}"):
                st.rerun()

    # Model Information
    with st.expander("🔬 Model Information"):
        st.markdown("""
        **🏆 Optimization Results:**
        - **Final Validation Loss:** 2.2066 (55% better than baseline)
        - **Perplexity:** 9.08 (93% improvement!)
        - **Training Time:** 38 minutes with Tesla T4 GPU
        - **Systematic Optimization:** 11 experiments across 3 dimensions

        **🧠 Architecture:**
        - **Encoder:** BiLSTM (1 layer, bidirectional, 256 hidden units)
        - **Decoder:** LSTM (2 layers, 256 hidden units)
        - **Attention:** Luong-style attention mechanism
        - **Embeddings:** 256 dimensions for both languages
        - **Parameters:** 9.6M trainable parameters

        **📊 Optimal Hyperparameters:**
        - **Learning Rate:** 1e-3
        - **Batch Size:** 16
        - **Dropout:** 0.1
        - **Training Epochs:** 10
        - **Tokenization:** Custom BPE (Urdu: 8.3K vocab, Roman: 9.2K vocab)
        """)

    # Footer
    st.markdown("""
    <div class="footer">
        <p>🚀 <strong>Powered by Neural Machine Translation</strong></p>
        <p>Built with systematic hyperparameter optimization • PyTorch • Streamlit</p>
        <p>⚡ Optimized through 11 systematic experiments achieving 9.08 perplexity</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()