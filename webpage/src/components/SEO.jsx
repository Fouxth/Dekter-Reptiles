import { useEffect } from 'react';

export default function SEO({ title, description, image, url, type = 'website', noindex = false }) {
    useEffect(() => {
        const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
        const currentUrl = url ? `${siteUrl}${url}` : window.location.href;
        const finalTitle = title ? `${title} | Dexter Reptiles` : 'Dexter Reptiles | สยามเรปไทล์ ร้านขายงูออนไลน์';
        const finalDesc = description || 'สยามเรปไทล์ ร้านขายงูออนไลน์ นำเข้าและเพาะพันธุ์ Ball Python, Corn Snake, Hognose คุณภาพดี และให้คำปรึกษาการเลี้ยง';
        const finalImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}/vite.svg`; // Fallback to vite logo if no OG image

        document.title = finalTitle;

        const setMeta = (attrName, attrValue, content) => {
            let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attrName, attrValue);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        const setLink = (rel, href) => {
            let el = document.querySelector(`link[rel="${rel}"]`);
            if (!el) {
                el = document.createElement('link');
                el.setAttribute('rel', rel);
                document.head.appendChild(el);
            }
            el.setAttribute('href', href);
        };

        setMeta('name', 'description', finalDesc);

        if (noindex) {
            setMeta('name', 'robots', 'noindex, nofollow');
        } else {
            setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
        }

        setLink('canonical', currentUrl);

        // Open Graph
        setMeta('property', 'og:title', finalTitle);
        setMeta('property', 'og:description', finalDesc);
        setMeta('property', 'og:image', finalImage);
        setMeta('property', 'og:url', currentUrl);
        setMeta('property', 'og:type', type);

        // Twitter Card
        setMeta('name', 'twitter:card', 'summary_large_image');
        setMeta('name', 'twitter:title', finalTitle);
        setMeta('name', 'twitter:description', finalDesc);
        setMeta('name', 'twitter:image', finalImage);

    }, [title, description, image, url, type, noindex]);

    return null;
}
