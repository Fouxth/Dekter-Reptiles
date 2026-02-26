import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCustomerProfile, logoutCustomer as apiLogout } from '../services/api';

const CustomerAuthContext = createContext();

export const CustomerAuthProvider = ({ children }) => {
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = async () => {
        const token = localStorage.getItem('customerToken');
        if (!token) {
            setCustomer(null);
            setLoading(false);
            return;
        }

        try {
            const data = await getCustomerProfile();
            setCustomer(data);
        } catch (error) {
            console.error("Failed to refresh customer profile:", error);
            localStorage.removeItem('customerToken');
            setCustomer(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshProfile();
    }, []);

    const logout = () => {
        apiLogout();
        setCustomer(null);
    };

    return (
        <CustomerAuthContext.Provider value={{ customer, setCustomer, loading, logout, refreshProfile }}>
            {children}
        </CustomerAuthContext.Provider>
    );
};

export const useCustomerAuth = () => useContext(CustomerAuthContext);
