import { FaFilm, FaGithub } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 py-6 mt-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <FaFilm className="text-primary-500 text-xl mr-2" />
            <span className="text-white font-semibold">MovieMatch</span>
          </div>
          
          <div className="text-gray-400 text-sm">
            <p>Built with React, Firebase, and TMDB API</p>
            <p className="mt-1">© {new Date().getFullYear()} MovieMatch. All rights reserved.</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <a
              href="https://github.com/jsech3/MovieMatch"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaGithub className="text-2xl" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
