import React, { useEffect, useRef } from 'react';
import AirDatepicker from 'air-datepicker';
import 'air-datepicker/air-datepicker.css';
import './AirDatePicker.css';
import localeEn from 'air-datepicker/locale/en';

const AirDatePicker = ({ value, onChange, placeholder, className }) => {
    const inputRef = useRef(null);
    const dpRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            dpRef.current = new AirDatepicker(inputRef.current, {
                locale: localeEn,
                autoClose: true,
                dateFormat: 'yyyy-MM-dd',
                onSelect({ date, formattedDate }) {
                    if (onChange) {
                        onChange(formattedDate);
                    }
                }
            });
        }

        return () => {
            if (dpRef.current) {
                dpRef.current.destroy();
            }
        };
    }, []);

    useEffect(() => {
        if (dpRef.current && value) {
            // Only update if the selected date is different to avoid infinite loops
            const currentDate = dpRef.current.selectedDates[0];
            const newValue = new Date(value);

            if (!currentDate || currentDate.getTime() !== newValue.getTime()) {
                dpRef.current.selectDate(newValue, { silent: true });
            }
        } else if (dpRef.current && !value) {
            dpRef.current.clear();
        }
    }, [value]);

    return (
        <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className={className}
            readOnly // Usually best for AirDatepicker to prevent manual typing issues
        />
    );
};

export default AirDatePicker;
