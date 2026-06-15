import { Mail, Phone, MapPin } from "lucide-react"
import { Link } from "react-router-dom"

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-center">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Intellihire</h3>
            <p className="text-gray-400 mb-4">
              AI-powered job matching platform connecting job seekers with employers for better career opportunities.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 flex flex-col items-center">
              <li className="flex items-center">
                <Mail size={16} className="mr-2 text-gray-400" />
                <span className="text-gray-400">info@intellihire.com</span>
              </li>
              <li className="flex items-center">
                <Phone size={16} className="mr-2 text-gray-400" />
                <span className="text-gray-400"> (041) 111 128 128</span>
              </li>
              <li className="flex items-center">
                <MapPin size={16} className="mr-2 text-gray-400" />
                <span className="text-gray-400">Sargodha Road, Chiniot</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Intellihire. All rights reserved.</p>
          <p className="mt-2">
            Developed by Fakiha khalid, Mahrukh, Mahnoor
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

