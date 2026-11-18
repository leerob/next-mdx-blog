import MobileMenu from 'components/MobileMenu';
import NavTabs from 'components/NavTabs';
import ThemeCord from 'components/ThemeCord';

// The site's header. It sits in _app, outside the pages, so it stays mounted
// across client-side navigation: the menu, the tab pill and the cord keep
// their state and motion instead of being rebuilt on every page.
export default function SiteNav() {
  return (
    <div className="flex flex-col justify-center px-8">
      <nav className="flex items-center justify-between w-full relative max-w-2xl border-gray-200 dark:border-gray-700 mx-auto pt-8 pb-8 sm:pb-16  text-gray-900 bg-gray-50  dark:bg-gray-900 bg-opacity-60 dark:text-gray-100">
        <a href="#skip" className="skip-nav">
          Skip to content
        </a>
        <div className="flex items-center md:-ml-3.5">
          <MobileMenu />
          <NavTabs />
        </div>
        <ThemeCord />
      </nav>
    </div>
  );
}
