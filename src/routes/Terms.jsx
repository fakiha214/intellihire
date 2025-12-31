"use client"

import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/" className="text-blue-600 hover:text-blue-800 mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Terms of Service & Privacy Policy</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          {/* Terms of Service */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h2>

            <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing and using the IntelliHire platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Use License</h3>
                <p>
                  Permission is granted to temporarily download one copy of the materials (information or software) on IntelliHire for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>Modifying or copying the materials</li>
                  <li>Using the materials for any commercial purpose or for any public display</li>
                  <li>Attempting to decompile or reverse engineer any software contained on the platform</li>
                  <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
                  <li>Removing any copyright or other proprietary notations from the materials</li>
                  <li>Engaging in any conduct that restricts or inhibits anyone's use or enjoyment of the platform</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Disclaimer</h3>
                <p>
                  The materials on the IntelliHire website are provided on an "as-is" basis. IntelliHire makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Limitations</h3>
                <p>
                  In no event shall IntelliHire or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the IntelliHire website, even if IntelliHire or an authorized representative has been notified of the possibility of such damage.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">5. Accuracy of Materials</h3>
                <p>
                  The materials appearing on the IntelliHire website could include technical, typographical, or photographic errors. IntelliHire does not warrant that any of the materials on the platform are accurate, complete, or current. IntelliHire may make changes to the materials contained on its website at any time without notice.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">6. User Content</h3>
                <p>
                  By submitting any content (resumes, cover letters, job postings, etc.) to IntelliHire, you grant the platform the right to use, display, and distribute such content in connection with the service. You represent and warrant that you own or have the necessary rights to the content you submit.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">7. Prohibited Activities</h3>
                <p>
                  You agree not to use the platform to:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>Harass, threaten, or intimidate any user</li>
                  <li>Post misleading or fraudulent job listings or applications</li>
                  <li>Engage in any form of discrimination based on protected characteristics</li>
                  <li>Attempt to gain unauthorized access to the platform or its services</li>
                  <li>Post spam, advertisements, or promotional content</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">8. Limitation of Liability</h3>
                <p>
                  IntelliHire shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the services, even if advised of the possibility of such damages.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy Policy */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h2>

            <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Information We Collect</h3>
                <p>
                  We collect information you provide directly to us, such as when you create an account, complete your profile, post a job, or apply for a position. This information may include:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>Name, email address, and phone number</li>
                  <li>Resume, work history, and educational background</li>
                  <li>Company information and job postings</li>
                  <li>Payment information (processed securely)</li>
                  <li>Communication preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2. How We Use Your Information</h3>
                <p>
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>Operate and improve the platform</li>
                  <li>Match job seekers with opportunities</li>
                  <li>Send you job recommendations and alerts</li>
                  <li>Process applications and payments</li>
                  <li>Respond to your inquiries</li>
                  <li>Comply with legal requirements</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Information Security</h3>
                <p>
                  IntelliHire implements appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no transmission over the internet is completely secure, and we cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Data Retention</h3>
                <p>
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy. You can request deletion of your account and associated data at any time through your account settings.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">5. Sharing of Information</h3>
                <p>
                  We do not sell your personal information. We may share your information with:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>Employers to whom you apply (with your consent)</li>
                  <li>Job seekers to employers posting jobs (as needed for applications)</li>
                  <li>Service providers who assist in platform operations</li>
                  <li>Legal authorities when required by law</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">6. Cookies and Tracking</h3>
                <p>
                  IntelliHire uses cookies and similar technologies to enhance your user experience, remember your preferences, and understand how the platform is being used. You can control cookie settings through your browser preferences.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">7. Your Rights</h3>
                <p>
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>Right to access your information</li>
                  <li>Right to correct inaccurate information</li>
                  <li>Right to request deletion of your information</li>
                  <li>Right to opt-out of marketing communications</li>
                  <li>Right to data portability</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">8. Children's Privacy</h3>
                <p>
                  IntelliHire is not intended for users under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have inadvertently collected information from a child, we will take steps to delete such information.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">9. Changes to This Policy</h3>
                <p>
                  We reserve the right to modify this privacy policy at any time. Changes will be effective immediately upon posting to the website. Your continued use of the platform following the posting of revised terms means that you accept and agree to the changes.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">10. Contact Us</h3>
                <p>
                  If you have questions about this Terms of Service or Privacy Policy, please contact us at:
                </p>
                <div className="mt-2 space-y-1 text-gray-700">
                  <p><strong>Email:</strong> support@careerconnect.pk</p>
                  <p><strong>Address:</strong> Karachi, Pakistan</p>
                </div>
              </div>
            </div>
          </section>

          {/* Last Updated */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">Last Updated: March 1, 2026</p>
          </div>

          {/* Back Button */}
          <div className="mt-8 flex justify-center">
            <Link
              to="/"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Terms

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};
