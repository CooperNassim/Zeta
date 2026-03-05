import React from 'react'

const ScoreButtons = ({ 
  scores = [0, 1, 2], 
  selectedScore, 
  onChange, 
  name,
  className = '',
  labelClassName = 'text-sm text-gray-700'
}) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      {scores.map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          className="px-4 py-1.5 rounded-lg border border-gray-200 hover:border-gray-900 transition-all text-base font-normal min-w-[60px] h-9"
          style={{
            background: selectedScore === score ? '#0F1419' : '#FFFFFF',
            color: selectedScore === score ? '#FFFFFF' : '#000000',
            borderColor: selectedScore === score ? '#0F1419' : undefined
          }}
        >
          {score}
        </button>
      ))}
    </div>
  )
}

export default ScoreButtons
