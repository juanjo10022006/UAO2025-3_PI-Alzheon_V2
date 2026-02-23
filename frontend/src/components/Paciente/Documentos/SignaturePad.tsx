import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
    onExportFile: (file: File) => void
}

export const SignaturePad = ({ onExportFile }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const dpr = useMemo(() => window.devicePixelRatio || 1, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        canvas.width = Math.floor(rect.width * dpr)
        canvas.height = Math.floor(rect.height * dpr)

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.scale(dpr, dpr)
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
    }, [dpr])

    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!
        const rect = canvas.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        canvas.setPointerCapture(e.pointerId)

        const { x, y } = getPos(e)
        ctx.beginPath()
        ctx.moveTo(x, y)
        setIsDrawing(true)
    }

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        const { x, y } = getPos(e)
        ctx.lineTo(x, y)
        ctx.stroke()
    }

    const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.releasePointerCapture(e.pointerId)
        setIsDrawing(false)
    }

    const clear = () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        const rect = canvas.getBoundingClientRect()
        ctx.clearRect(0, 0, rect.width, rect.height)
    }

    const exportPng = async () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const blob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/png')
        )

        if (!blob) return

        const file = new File([blob], `firma-${Date.now()}.png`, { type: 'image/png' })
        onExportFile(file)
    }

    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <p className="patient-section-title">Firma dibujada</p>
                <div className="flex gap-2">
                    <button type="button" onClick={clear} className="glass-button rounded-full px-4 py-2 text-sm font-semibold text-white">
                        Borrar
                    </button>
                    <button type="button" onClick={exportPng} className="glass-button rounded-full px-4 py-2 text-sm font-semibold text-white">
                        Guardar (PNG)
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-white/20 overflow-hidden bg-white/5">
                <canvas
                    ref={canvasRef}
                    className="w-full h-[180px] touch-none"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                />
            </div>

            <p className="text-xs text-white/70">
                Puedes firmar con mouse o pantalla táctil. Luego presiona “Guardar (PNG)” para dejar la firma lista para subir.
            </p>
        </div>
    )
}