import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { noticesAPI } from '../../../services/api';

const initialFormState = {
  title: '',
  noticeTypeId: '',
  text: '',
};

const mapApiErrorToMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.';

  if (error.response?.data?.detail) {
    return Array.isArray(error.response.data.detail)
      ? error.response.data.detail.join(', ')
      : error.response.data.detail;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

const SendNoticeModal = ({ isOpen, onClose, target, onSent }) => {
  const [noticeTypes, setNoticeTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [typesError, setTypesError] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [hasLoadedTypes, setHasLoadedTypes] = useState(false);

  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setSubmitError(null);
  }, []);

  const fetchNoticeTypes = useCallback(async () => {
    try {
      setLoadingTypes(true);
      setTypesError(null);
      const response = await noticesAPI.getTypes();
      setNoticeTypes(Array.isArray(response.data) ? response.data : []);
      setHasLoadedTypes(true);
    } catch (error) {
      console.error('Failed to load notice types:', error);
      setTypesError(mapApiErrorToMessage(error));
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetForm();

    if (!hasLoadedTypes) {
      fetchNoticeTypes();
    }
  }, [isOpen, hasLoadedTypes, fetchNoticeTypes, resetForm]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // If target changes while modal open, clear errors and keep subject empty for new context
    setSubmitError(null);
  }, [target, isOpen]);

  const isValid = useMemo(() => {
    return (
      Boolean(target) &&
      form.title.trim().length > 0 &&
      form.text.trim().length > 0 &&
      Boolean(form.noticeTypeId)
    );
  }, [form.noticeTypeId, form.text, form.title, target]);

  const locationLabel = useMemo(() => {
    if (!target?.name) {
      return 'Location';
    }

    if (target?.type) {
      return `${target.name} (${target.type})`;
    }

    return target.name;
  }, [target]);

  const handleOverlayClick = useCallback(() => {
    if (!isSubmitting) {
      onClose?.();
    }
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        district_id: target?.districtId ?? null,
        block_id: target?.blockId ?? null,
        gp_id: target?.gpId ?? null,
        notice_type_id: Number(form.noticeTypeId),
        title: form.title.trim(),
        text: form.text.trim(),
        media_urls: [],
      };

      const response = await noticesAPI.createNotice(payload);

      onSent?.(response.data);
      onClose?.();
      resetForm();
    } catch (error) {
      console.error('Failed to send notice:', error);
      setSubmitError(mapApiErrorToMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [form.noticeTypeId, form.text, form.title, isSubmitting, isValid, onClose, onSent, resetForm, target]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.35)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
            }}
          >
            Notice — {locationLabel}
          </h2>
          <button
            onClick={handleOverlayClick}
            style={{
              background: 'none',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: '4px',
              color: '#6b7280',
            }}
            disabled={isSubmitting}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {typesError && (
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
              }}
            >
              <div style={{ marginBottom: '8px' }}>{typesError}</div>
              <button
                type="button"
                onClick={fetchNoticeTypes}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
                disabled={loadingTypes}
              >
                {loadingTypes ? 'Retrying…' : 'Retry loading categories'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
              }}
            >
              Subject
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Enter subject"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
              }}
            >
              Category
            </label>
            <select
              value={form.noticeTypeId}
              onChange={(event) => setForm((prev) => ({ ...prev, noticeTypeId: event.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: loadingTypes ? '#f9fafb' : 'white',
                color: loadingTypes ? '#9ca3af' : '#111827',
              }}
              disabled={loadingTypes || isSubmitting || noticeTypes.length === 0}
            >
              <option value="" disabled>
                {loadingTypes ? 'Loading categories…' : 'Select category'}
              </option>
              {noticeTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
              }}
            >
              Details
            </label>
            <textarea
              value={form.text}
              onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))}
              placeholder="Enter notice details"
              rows={6}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              disabled={isSubmitting}
            />
          </div>

          {submitError && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
              }}
            >
              {submitError}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={handleOverlayClick}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 20px',
              backgroundColor: isValid ? '#10b981' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isValid && !isSubmitting ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendNoticeModal;

