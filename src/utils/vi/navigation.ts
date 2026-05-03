const navBarLinks = [
  { name: 'Trang chủ', url: '/vi' },
  {
    name: 'C.H.E.S.S',
    url: '/vi/chess',
    children: [
      { name: 'Project: Compassio', url: '/vi/projects/compassio' },
      { name: 'Case Study Dancenter', url: '/case-studies/dancenter-chess' },
      {
        name: 'Case Study The School of Life',
        url: '/case-studies/the-school-of-life-chess',
      },
    ],
  },
  { name: 'Dịch vụ', url: '/vi/services' },
  { name: 'Sản phẩm', url: '/vi/products' },
  { name: 'Blog', url: '/vi/blog' },
  { name: 'Hướng dẫn', url: '/vi/guides/getting-started/' },
  { name: 'Liên hệ', url: '/vi/contact' },
];

const footerLinks = [
  {
    section: 'Khám phá',
    links: [
      { name: 'Mô hình C.H.E.S.S', url: '/vi/chess' },
      { name: 'Projects', url: '/projects' },
      { name: 'Sản phẩm', url: '/vi/products' },
      { name: 'Dịch vụ', url: '/vi/services' },
      { name: 'Case Studies', url: '/case-studies' },
    ],
  },
  {
    section: 'Tài nguyên',
    links: [
      { name: 'Blog', url: '/vi/blog' },
      { name: 'Hướng dẫn', url: '/vi/guides/getting-started/' },
      { name: 'Projects', url: '/projects/' },
    ],
  },
  {
    section: 'Công ty',
    links: [
      { name: 'Về chúng tôi', url: '/vi/about' },
      { name: 'Đội ngũ', url: '/vi/about#team' },
      { name: 'Liên hệ', url: '/vi/contact' },
    ],
  },
];

const socialLinks = {
  facebook: '',
  x: '',
  github: 'https://github.com/xuanpv89/folks-template-screwfast',
  google: '',
  slack: '',
};

export default {
  navBarLinks,
  footerLinks,
  socialLinks,
};
