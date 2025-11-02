import React, { useState } from 'react';
import PropTypes from 'prop-types';

const INITIAL_FORM_STATE = {
  name: '',
  email: '',
  phone: '',
  reason: ''
};

BookingForm.propTypes = {
  selectedSlot: PropTypes.shape({
    starts_at: PropTypes.string.isRequired, // now includes timezone offset
    formattedDate: PropTypes.string.isRequired,
    formattedTime: PropTypes.string.isRequired,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default function BookingForm({ selectedSlot, onSubmit, onClose }) {
  const initialData = selectedSlot ? {
    ...INITIAL_FORM_STATE,
    starts_at: selectedSlot.starts_at // now includes timezone offset
  } : INITIAL_FORM_STATE;

  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedSlot) return null;

  const validateField = (name, value) => {
    if (!value) return '';  // Don't show errors for empty fields initially
    
    switch (name) {
      case 'name':
        return value.length < 2 ? 'Name must be at least 2 characters' : '';
      case 'email':
        return !/\S+@\S+\.\S+/.test(value) ? 'Please enter a valid email' : '';
      case 'phone':
        return value && !/^\+?[\d\s-]{8,}$/.test(value) ? 'Please enter a valid phone number' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
    
    // Only set error if there actually is one
    const error = validateField(name, value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];  // Remove error when field becomes valid
      }
      return newErrors;
    });
  };

  const isFormValid = () => {
    // Check only required fields
    const requiredFields = ['starts_at', 'name', 'email'];
    let isValid = true;
    const newErrors = {};

    // Check required fields
    for (const field of requiredFields) {
      if (!data[field]) {
        isValid = false;
        newErrors[field] = 'This field is required';
      } else {
        const error = validateField(field, data[field]);
        if (error) {
          isValid = false;
          newErrors[field] = error;
        }
      }
    }

    // Check optional fields only if they have values
    const optionalFields = ['phone', 'reason'];
    for (const field of optionalFields) {
      if (data[field]) {
        const error = validateField(field, data[field]);
        if (error) {
          isValid = false;
          newErrors[field] = error;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsSubmitting(true);
    setMsg(null);

    try {
      await onSubmit(data);
      console.log('Form submitted successfully');
      setMsg({ type: 'success', text: 'Appointment booked successfully!' });
      // Wait a moment to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      onClose();
    } catch (err) {
      console.error('Form submission error:', err);
      let errorMsg = 'Failed to book appointment. Please try again.';
      const apiErrors = err.response?.data?.errors;

      if (Array.isArray(apiErrors)) {
        errorMsg = apiErrors.join(', ');  // combine multiple messages
      } else if (typeof apiErrors === 'string') {
        errorMsg = apiErrors;
      }

      setMsg({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormField = (type, name, label, placeholder, required = false) => (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          className={`form-control ${errors[name] ? 'error' : ''}`}
          value={data[name]}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          className={`form-control ${errors[name] ? 'error' : ''}`}
          value={data[name]}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
        />
      )}
      {errors[name] && <small className="error-text">{errors[name]}</small>}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Book Appointment</h3>
          <button type="button" className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="selected-datetime">
            {selectedSlot.formattedDate} at {selectedSlot.formattedTime}
          </p>
          <form onSubmit={handleSubmit}>
            {renderFormField('text', 'name', 'Full Name *', 'Enter your full name', true)}
            {renderFormField('email', 'email', 'Email Address *', 'Enter your email', true)}
            {renderFormField('tel', 'phone', 'Phone Number', 'Enter your phone number')}
            {renderFormField('textarea', 'reason', 'Reason for Visit', 'Briefly describe the reason for your visit')}
            
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || Object.keys(errors).length > 0}
              >
                {isSubmitting ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
            {msg && <div className={`message ${msg.type}`}>{msg.text}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
