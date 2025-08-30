export function Footer() {
  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#' },
        { name: 'Integrations', href: '#' },
        { name: 'Updates', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Careers', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy', href: '#' },
        { name: 'Terms', href: '#' },
        { name: 'Security', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-background px-6 sm:px-8 lg:px-12 py-12 sm:py-16 border-t border-border theme-transition">
      <div className="w-full">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              Permoney
            </div>
            <p className="text-sm text-muted-foreground">
              A simple way to control your finances.
            </p>
          </div>
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold mb-3 sm:mb-4">{section.title}</h3>
              <div className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.href}
                    className="block text-sm text-muted-foreground hover:text-neon-green transition-all duration-200 hover:translate-x-1"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-8 sm:mt-12 pt-6 sm:pt-8">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © 2025 Permoney. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
