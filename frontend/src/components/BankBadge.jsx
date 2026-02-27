import React from 'react';

export const THAI_BANKS = [
    { id: 'kbank', name: 'กสิกรไทย (K-Bank)', abbr: 'K', color: '#138f2d', textColor: '#fff' },
    { id: 'scb', name: 'ไทยพาณิชย์ (SCB)', abbr: 'SCB', color: '#4e2e7f', textColor: '#fff' },
    { id: 'bbl', name: 'กรุงเทพ (BBL)', abbr: 'BBL', color: '#1e388c', textColor: '#fff' },
    { id: 'ktb', name: 'กรุงไทย (KTB)', abbr: 'KTB', color: '#1ba5e1', textColor: '#fff' },
    { id: 'bay', name: 'กรุงศรีอยุธยา (BAY)', abbr: 'BAY', color: '#fec43b', textColor: '#000' },
    { id: 'ttb', name: 'ทหารไทยธนชาต (ttb)', abbr: 'ttb', color: '#005da4', textColor: '#fff' },
    { id: 'gsb', name: 'ออมสิน (GSB)', abbr: 'GSB', color: '#eb198d', textColor: '#fff' },
    { id: 'baac', name: 'ธ.ก.ส. (BAAC)', abbr: 'ก.ส', color: '#006a35', textColor: '#fff' },
    { id: 'uob', name: 'ยูโอบี (UOB)', abbr: 'UOB', color: '#003d79', textColor: '#fff' },
    { id: 'cimb', name: 'ซีไอเอ็มบี (CIMB)', abbr: 'CIMB', color: '#7e2f36', textColor: '#fff' },
    { id: 'tisco', name: 'ทิสโก้ (TISCO)', abbr: 'TIS', color: '#115da8', textColor: '#fff' },
    { id: 'kkp', name: 'เกียรตินาคินภัทร (KKP)', abbr: 'KKP', color: '#222666', textColor: '#fff' },
    { id: 'lhbank', name: 'แลนด์ แอนด์ เฮ้าส์ (LH Bank)', abbr: 'LH', color: '#6e2c91', textColor: '#fff' },
    { id: 'other', name: 'อื่นๆ', abbr: '?', color: '#475569', textColor: '#fff' },
];

/**
 * BankBadge — colored square badge with bank abbreviation.
 * No external URLs. Works offline.
 */
export default function BankBadge({ bankName, size = 24 }) {
    const bank = THAI_BANKS.find(b => b.name === bankName);
    if (!bank) return null;

    const fontSize = size <= 24 ? Math.max(8, size * 0.38) : Math.max(10, size * 0.3);

    return (
        <div
            style={{
                width: size,
                height: size,
                background: bank.color,
                borderRadius: Math.round(size * 0.22),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontWeight: 900,
                fontSize: fontSize,
                color: bank.textColor,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                fontFamily: 'sans-serif',
                userSelect: 'none',
            }}
        >
            {bank.abbr}
        </div>
    );
}
