import React, { useState, useEffect, useCallback, useRef } from 'react'
import { EntityCustomViewParams } from '@firecms/core'

/**
 * Editable JSON view component for FireCMS entities.
 * Allows users to edit entity data directly in JSON format with validation and save functionality.
 */
export function EditableJsonView<M extends Record<string, any>>({
  entity,
  modifiedValues,
  formContext,
}: EntityCustomViewParams<M>) {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isEdited, setIsEdited] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  // Constants
  const SUCCESS_MESSAGE_TIMEOUT_MS = 5000

  // Track component mount status
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initialize JSON text from entity values
  useEffect(() => {
    const values = modifiedValues || entity?.values || {}
    setJsonText(JSON.stringify(values, null, 2))
    setIsEdited(false)
    setError(null)
  }, [entity, modifiedValues])

  // Handle JSON text changes
  const handleJsonChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setJsonText(event.target.value)
      setIsEdited(true)
      setError(null)
      setSuccessMessage(null)
    },
    []
  )

  // Validate and save JSON
  const handleSave = useCallback(() => {
    try {
      // Validate JSON
      const parsedValues = JSON.parse(jsonText)

      // Ensure it's an object
      if (typeof parsedValues !== 'object' || parsedValues === null || Array.isArray(parsedValues)) {
        setError('JSON must be an object (not an array or primitive value)')
        return
      }

      // Update form values
      if (formContext.setFieldValue) {
        const currentValues = modifiedValues || entity?.values || {}
        
        // Remove fields that were deleted from the JSON
        Object.keys(currentValues).forEach((key) => {
          if (!(key in parsedValues)) {
            formContext.setFieldValue(key, undefined)
          }
        })
        
        // Update all fields with the new values
        Object.entries(parsedValues).forEach(([key, value]) => {
          formContext.setFieldValue(key, value)
        })

        setError(null)
        setSuccessMessage('JSON saved successfully! Click the main Save button to persist changes.')
        setIsEdited(false)

        // Clear success message after timeout with cleanup check
        setTimeout(() => {
          if (isMountedRef.current) {
            setSuccessMessage(null)
          }
        }, SUCCESS_MESSAGE_TIMEOUT_MS)
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Invalid JSON: ${err.message}`)
      } else {
        setError('An error occurred while saving')
      }
    }
  }, [jsonText, formContext, entity, modifiedValues, SUCCESS_MESSAGE_TIMEOUT_MS])

  // Reset to original values
  const handleReset = useCallback(() => {
    const values = modifiedValues || entity?.values || {}
    setJsonText(JSON.stringify(values, null, 2))
    setIsEdited(false)
    setError(null)
    setSuccessMessage(null)
  }, [entity, modifiedValues])

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    transition: 'all 0.2s',
  }

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#1976d2',
    color: 'white',
  }

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#1976d2',
    border: '1px solid #1976d2',
  }

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#e0e0e0',
    color: '#9e9e9e',
    cursor: 'not-allowed',
  }

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={handleSave}
          disabled={!isEdited}
          style={isEdited ? primaryButtonStyle : disabledButtonStyle}
        >
          Save JSON
        </button>
        <button
          onClick={handleReset}
          disabled={!isEdited}
          style={isEdited ? secondaryButtonStyle : disabledButtonStyle}
        >
          Reset
        </button>
        {error && (
          <span style={{ color: 'red', marginLeft: '8px', fontSize: '14px' }}>
            {error}
          </span>
        )}
        {successMessage && (
          <span style={{ color: 'green', marginLeft: '8px', fontSize: '14px' }}>
            {successMessage}
          </span>
        )}
      </div>
      <textarea
        value={jsonText}
        onChange={handleJsonChange}
        style={{
          flex: 1,
          fontFamily: 'monospace',
          fontSize: '14px',
          padding: '12px',
          border: error ? '2px solid red' : '1px solid #ccc',
          borderRadius: '4px',
          resize: 'vertical',
          minHeight: '400px',
        }}
        placeholder="Enter valid JSON..."
      />
      {!entity && (
        <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
          Note: This is a new entity. The JSON will be populated once you save the form.
        </div>
      )}
    </div>
  )
}
