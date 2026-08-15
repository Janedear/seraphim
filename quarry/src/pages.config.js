import Layout from './Layout.jsx';

const modules = import.meta.glob('./pages/*.jsx', { eager: true });

export const PAGES = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => {
    const name = path.slice(path.lastIndexOf('/') + 1, -4);
    return [name, mod.default];
  })
);

export const pagesConfig = {
  mainPage: 'Dashboard',
  Pages: PAGES,
  Layout,
};
