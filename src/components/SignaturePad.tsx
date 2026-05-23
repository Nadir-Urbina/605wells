'use client'

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

export interface SignaturePadHandle {
  getDataURL: () => string | null
  clear: () => void
  isEmpty: () => boolean
}

interface SignaturePadProps {
  height?: number
  onSign?: () => void
  className?: string
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ height = 180, onSign, className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)
    const hasDrawn = useRef(false)
    const lastPos = useRef<{ x: number; y: number } | null>(null)

    useImperativeHandle(ref, () => ({
      getDataURL: () => {
        if (!hasDrawn.current) return null
        return canvasRef.current?.toDataURL('image/png') ?? null
      },
      clear: () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          hasDrawn.current = false
        }
      },
      isEmpty: () => !hasDrawn.current,
    }))

    const initCanvas = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }, [])

    useEffect(() => {
      initCanvas()
    }, [initCanvas])

    const getPos = (
      e: MouseEvent | TouchEvent,
      canvas: HTMLCanvasElement
    ): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      if ('touches' in e) {
        const touch = e.touches[0]
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        }
      }
      return {
        x: ((e as MouseEvent).clientX - rect.left) * scaleX,
        y: ((e as MouseEvent).clientY - rect.top) * scaleY,
      }
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      isDrawing.current = true
      const canvas = canvasRef.current!
      lastPos.current = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas)
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing.current || !lastPos.current) return
      e.preventDefault()
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas)

      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      lastPos.current = pos

      if (!hasDrawn.current) {
        hasDrawn.current = true
        onSign?.()
      }
    }

    const stopDrawing = () => {
      isDrawing.current = false
      lastPos.current = null
    }

    return (
      <canvas
        ref={canvasRef}
        width={900}
        height={height * 2}
        className={`w-full cursor-crosshair touch-none ${className}`}
        style={{ height: `${height}px` }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    )
  }
)

SignaturePad.displayName = 'SignaturePad'

export default SignaturePad
