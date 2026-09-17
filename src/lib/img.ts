export const transformImg = (url: string, t: string) => {
  if (!url) return url;
  
  // 1. Automatic Domain Migration (Fix Broken Links)
  // Replace old 'blom-cosmetics' AND incorrect 'dd89enrjz' with the CORRECT 'drsrbzm2t'
  let newUrl = url
    .replace('res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t')
    .replace('res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t');

  // 2. Safe Optimization (fixes slow loading)
  if (newUrl.includes('res.cloudinary.com') && newUrl.includes('/upload/')) {
    if (!newUrl.includes(t)) {
      return newUrl.replace('/upload/', `/upload/${t}/`);
    }
  }

  return newUrl;
};

export const cardImg = (u: string) => transformImg(u, "f_auto,q_auto,w_400,h_400,c_fill,g_auto");
export const galleryImg = (u: string) => transformImg(u, "f_auto,q_auto,w_1200");
