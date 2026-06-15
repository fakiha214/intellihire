import React, { useState } from 'react'; // React import for safety
import { formatTimestamp } from '../../utils/chatConstants';
import { Trash2, Download, Loader2 } from 'lucide-react'; // Download icon is safer than FileDown

const MessageBubble = ({ message, onDelete = null }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  if (!message) return null; // Guard against empty messages

  const isUser = message.role === 'user';
  
  // CV detect karne ke liye keywords
  const isCV = !isUser && message.content && (
    message.content.includes('Experience') || 
    message.content.includes('Education') || 
    message.content.includes('Skills') ||
    message.content.toLowerCase().includes('curriculum vitae')
  );

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // SMART MOVE: Use relative path '/api/...' instead of hardcoded ''
      // This bypasses CORS errors and "Failed to fetch" issues
      const response = await fetch('/api/chat/generate-cv-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            content: message.content 
        }),
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Server processing error');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CV_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up to save browser memory
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Download Error:", err);
      alert("Could not generate PDF: " + err.message);
    } finally {
      setIsGenerating(false);
    }
};
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fadeIn`}>
      <div className={`group max-w-xs lg:max-w-md transition-all duration-300 ${
            isUser ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-900 shadow-sm'
        } rounded-2xl px-4 py-3 ${isUser ? 'rounded-br-none' : 'rounded-bl-none'}`}>
        
        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
          {message.content}
        </p>

        {isCV && (
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all shadow-sm"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isGenerating ? 'Wait...' : 'Download as PDF'}
          </button>
        )}

        <div className={`mt-2 flex items-center justify-between text-[10px] ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          <span>{formatTimestamp(message.timestamp)}</span>
          {onDelete && isUser && (
            <button 
              onClick={() => onDelete(message.id)} 
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;