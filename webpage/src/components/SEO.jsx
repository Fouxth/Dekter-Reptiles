import React, { useEffect } from 'react';

const SEO = ({ title, description }) => {
    useEffect(() => {
        document.title = title ? `${title} | Dexter Reptiles (Dexter Reptiles)` : 'Dexter Reptiles | ร้านขายงูออนไลน์ Ball Python, Corn Snake อันดับ 1';

        // Update or create meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = description || 'ร้านขายงูสายพันธุ์แท้ Ball Python, Corn Snake, Hognose พร้อมให้คำปรึกษาการเลี้ยงดูจากผู้เชี่ยวชาญ สุขภาพดีทุกตัว ส่งตรงถึงบ้าน';
    }, [title, description]);

    return null;
};

export default SEO;
