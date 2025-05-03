import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Telegram } from "@mui/icons-material";

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
          <div className="px-5 py-2">
            <Link href="/" className="text-base text-gray-500 hover:text-gray-900">
              {t('nav.home')}
            </Link>
          </div>

          <div className="px-5 py-2">
            <Link href="/about" className="text-base text-gray-500 hover:text-gray-900">
              {t('nav.about')}
            </Link>
          </div>

          <div className="px-5 py-2">
            <Link href="/projects" className="text-base text-gray-500 hover:text-gray-900">
              {t('nav.projects')}
            </Link>
          </div>

          <div className="px-5 py-2">
            <Link href="/contacts" className="text-base text-gray-500 hover:text-gray-900">
              {t('nav.contacts')}
            </Link>
          </div>

          <div className="px-5 py-2">
            <Link href="/privacy" className="text-base text-gray-500 hover:text-gray-900">
              {t('footer.privacy')}
            </Link>
          </div>

          <div className="px-5 py-2">
            <Link href="/terms" className="text-base text-gray-500 hover:text-gray-900">
              {t('footer.terms')}
            </Link>
          </div>
        </nav>
        <div className="mt-8 flex justify-center space-x-6">
          <a href="#" className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Facebook</span>
            <Facebook />
          </a>

          <a href="#" className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Instagram</span>
            <Instagram />
          </a>

          <a href="#" className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Twitter</span>
            <Twitter />
          </a>

          <a href="#" className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Telegram</span>
            <Telegram />
          </a>
        </div>
        <p className="mt-8 text-center text-base text-gray-400">
          &copy; {currentYear} VolunteerHub. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
