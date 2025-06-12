import { useState, useCallback } from 'react';

const useForm = (initialState) => {
    const [formData, setFormData] = useState(initialState);

    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }, []);

    const resetForm = useCallback(() => setFormData(initialState), [initialState]);

    return [formData, handleInputChange, setFormData, resetForm];
};
export default useForm;
