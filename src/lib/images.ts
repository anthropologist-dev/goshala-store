// Images currently hosted on the Hostinger/Zyro CDN. Move these to your own
// storage (or /public) before you cancel the Hostinger plan.
const zyro = (path: string, w = 1200) => `https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=${w}/mnlWJ4krkLtbEzkz/${path}`;
const store = (file: string, w = 900) =>
  `https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=${w}/cdn-ecommerce/store_01JS6YQXW04XMF0T02FK69SF8F%2Fassets%2F${file}`;

export const IMG = {
  logo: zyro("logotext-A3Q7ZJNVNgSV7M0G.png", 480),
  heroCow: zyro("desicow-Yg2ykl5XkBt5GxP4.jpg", 1600),
  poojaEssentials: zyro("poojaessentials-YNqB2Mk5l4U9OzR1.png", 900),
  pushpakaBanner: zyro("pushpakavimana-AE0Pr7kVvqSKRVKw.jpg", 900),
  community: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=900/cdn-builder-placeholders/asset-manager/oggezWlumg0.jpeg",
  woodenCow: "https://images.unsplash.com/photo-1589658857369-9f92af08f61a?auto=format&fit=crop&w=400&q=70",
  aboutCow: "https://images.unsplash.com/photo-1640650926372-d9596e9f5f77?auto=format&fit=crop&w=900&q=70",
  blogHero: "https://images.unsplash.com/photo-1601838002907-331575774e3f?auto=format&fit=crop&w=1200&q=70",
  products: {
    taamragoura: store("1751004387936-tg25c.png"),
    pushpakavimana: store("1751003952190-pv.png"),
    gomaya: store("1752084053905-gomayapowder.jpg"),
  },
};
