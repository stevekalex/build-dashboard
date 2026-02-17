'use client'

export function TodayDate() {
  return (
    <>
      {new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })}
    </>
  )
}
