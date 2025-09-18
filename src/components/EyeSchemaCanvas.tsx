import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, Minus, Plus, RotateCcw, Palette, Info } from 'lucide-react';
import type { EyeLengthMap } from '../types';
import { useAppColors } from '../hooks/useAppColors';

interface EyeSchemaCanvasProps {
  value: EyeLengthMap;
  onChange: (value: EyeLengthMap) => void;
  className?: string;
}

interface EyePoint {
  x: number;
  y: number;
  id: string;
  length: number;
  label: string;
  angle: number;
}


const EyeSchemaCanvas: React.FC<EyeSchemaCanvasProps> = ({ 
  value, 
  onChange, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [points, setPoints] = useState<EyePoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const [showInfo, setShowInfo] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [isRepositionMode, setIsRepositionMode] = useState(false);
  const [isDragged, setIsDragged] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState<string | null>(null);
  const colors = useAppColors();

  // Mappa delle etichette più user-friendly
  const pointLabels: Record<string, string> = {
    // Occhio sinistro
    left_inner_corner: 'Sx Angolo Interno',
    left_upper_inner: 'Sx Superiore Interno',
    left_upper_center: 'Sx Centro Superiore',
    left_upper_outer: 'Sx Superiore Esterno',
    left_outer_corner: 'Sx Angolo Esterno',
    left_lower_outer: 'Sx Inferiore Esterno',
    left_lower_center: 'Sx Centro Inferiore',
    left_lower_inner: 'Sx Inferiore Interno',
    left_upper_mid_inner: 'Sx Medio Sup. Interno',
    left_lower_mid_inner: 'Sx Medio Inf. Interno',
    // Occhio destro
    right_inner_corner: 'Dx Angolo Interno',
    right_upper_inner: 'Dx Superiore Interno',
    right_upper_center: 'Dx Centro Superiore',
    right_upper_outer: 'Dx Superiore Esterno',
    right_outer_corner: 'Dx Angolo Esterno',
    right_lower_outer: 'Dx Inferiore Esterno',
    right_lower_center: 'Dx Centro Inferiore',
    right_lower_inner: 'Dx Inferiore Interno',
    right_upper_mid_inner: 'Dx Medio Sup. Interno',
    right_lower_mid_inner: 'Dx Medio Inf. Interno',
  };

  // Carica l'immagine di background
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setBackgroundImage(img);
      // Mantieni le dimensioni fisse a 500x500
      setCanvasSize({ width: 500, height: 500 });
    };
    img.src = '/lash_map.png';
  }, []);

  // Inizializza e aggiorna i punti dell'occhio con posizioni per entrambi gli occhi
  // Si attiva quando cambiano le dimensioni del canvas o i valori delle lunghezze
  useEffect(() => {
    // Solo se canvasSize è inizializzato
    if (canvasSize.width === 0 || canvasSize.height === 0) return;

    const centerY = canvasSize.height / 2;
    const eyeWidth = 85;
    const eyeHeight = 60;
    
    // Posizioni per occhio sinistro (a sinistra nel canvas)
    const leftCenterX = canvasSize.width * 0.30;
    // Posizioni per occhio destro (a destra nel canvas)
    const rightCenterX = canvasSize.width * 0.75;

    const initialPoints: EyePoint[] = [
      // Occhio sinistro - 10 punti
      // Primi 5 punti: alle punte delle ciglia superiori (più in alto)
      { x: leftCenterX - eyeWidth, y: centerY - eyeHeight * 1.8, id: 'left_inner_corner', length: value.left_inner_corner || 8, label: pointLabels.left_inner_corner, angle: 90 },
      { x: leftCenterX - eyeWidth * 0.6, y: centerY - eyeHeight * 2.0, id: 'left_upper_inner', length: value.left_upper_inner || 9, label: pointLabels.left_upper_inner, angle: 90 },
      { x: leftCenterX, y: centerY - eyeHeight * 2.3, id: 'left_upper_center', length: value.left_upper_center || 11, label: pointLabels.left_upper_center, angle: 90 },
      { x: leftCenterX + eyeWidth * 0.5, y: centerY - eyeHeight * 2.0, id: 'left_upper_outer', length: value.left_upper_outer || 12, label: pointLabels.left_upper_outer, angle: 90 },
      { x: leftCenterX + eyeWidth, y: centerY - eyeHeight * 1.8, id: 'left_outer_corner', length: value.left_outer_corner || 10, label: pointLabels.left_outer_corner, angle: 90 },
      
    
      // Occhio destro - 10 punti
      // Primi 5 punti: alle punte delle ciglia superiori (più in alto)
      { x: rightCenterX - eyeWidth, y: centerY - eyeHeight * 1.8, id: 'right_inner_corner', length: value.right_inner_corner || 8, label: pointLabels.right_inner_corner, angle: 90 },
      { x: rightCenterX - eyeWidth * 0.6, y: centerY - eyeHeight * 2.0, id: 'right_upper_inner', length: value.right_upper_inner || 9, label: pointLabels.right_upper_inner, angle: 90 },
      { x: rightCenterX, y: centerY - eyeHeight * 2.3, id: 'right_upper_center', length: value.right_upper_center || 11, label: pointLabels.right_upper_center, angle: 90 },
      { x: rightCenterX + eyeWidth * 0.5, y: centerY - eyeHeight * 2.0, id: 'right_upper_outer', length: value.right_upper_outer || 12, label: pointLabels.right_upper_outer, angle: 90 },
      { x: rightCenterX + eyeWidth, y: centerY - eyeHeight * 1.8, id: 'right_outer_corner', length: value.right_outer_corner || 10, label: pointLabels.right_outer_corner, angle: 90 },
      
     
    ];
    
    // Aggiorna i punti solo se sono effettivamente diversi
    setPoints(prevPoints => {
      // Se non ci sono punti precedenti, inizializza
      if (prevPoints.length === 0) {
        return initialPoints;
      }

      // Controlla se le lunghezze sono cambiate
      const hasLengthChanged = prevPoints.some((prevPoint, index) => {
        const newPoint = initialPoints[index];
        return newPoint && prevPoint.length !== newPoint.length;
      });

      // Controlla se le posizioni sono cambiate (per ridimensionamento canvas)
      const hasPositionChanged = prevPoints.some((prevPoint, index) => {
        const newPoint = initialPoints[index];
        return newPoint && (prevPoint.x !== newPoint.x || prevPoint.y !== newPoint.y);
      });

      return (hasLengthChanged || hasPositionChanged) ? initialPoints : prevPoints;
    });
  }, [canvasSize, value]);

  // Responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && backgroundImage) {
        const containerWidth = containerRef.current.offsetWidth;
        const aspectRatio = backgroundImage.width / backgroundImage.height;
        const width = Math.min(500, containerWidth - 32);
        const height = width / aspectRatio;
        setCanvasSize({ width, height });
      }
    };

    if (backgroundImage) {
      updateCanvasSize();
      window.addEventListener('resize', updateCanvasSize);
      return () => window.removeEventListener('resize', updateCanvasSize);
    }
  }, [backgroundImage]);
  // Disegno del canvas con l'immagine di background
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);

    // Pulisci il canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Disegna l'immagine di background
    ctx.drawImage(backgroundImage, 0, 0, canvasSize.width, canvasSize.height);

    // Disegna i punti e le ciglia sopra l'immagine
    points.forEach((point) => {
      const isSelected = selectedPoint === point.id;
      const isHovered = hoveredPoint === point.id;
      const isDragged = draggedPoint === point.id;
      const scale = isSelected ? 1.4 : isHovered ? 1.2 : 1;

      // Calcola la lunghezza della ciglia in pixel con scaling migliorato
      const lashLength = (point.length / 20) * 35; // Scala migliorata da mm a pixel

      // Calcola la direzione della ciglia basata sull'angolo
      const angleRad = (point.angle * Math.PI) / 180;
      const endX = point.x + Math.cos(angleRad) * lashLength;
      const endY = point.y + Math.sin(angleRad) * lashLength;

      // Colore della ciglia in base allo stato con gradazioni migliori
      let lashColor = '#4b5563'; // Grigio più scuro per default
      if (isRepositionMode) {
        lashColor = isDragged ? '#dc2626' : '#f59e0b';
      } else if (isSelected) {
        lashColor = colors.primary;
      } else if (isHovered) {
        lashColor = colors.primaryLight;
      }

      // Disegna la ciglia con curva naturale migliorata
      ctx.strokeStyle = lashColor;
      ctx.lineWidth = isSelected ? 3.5 : isHovered ? 3 : 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Aggiungi shadow per le ciglia selezionate/hover
      if (isSelected || isHovered || isDragged) {
        ctx.shadowColor = lashColor + '60';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;
      }
      
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      
      // Curva naturale della ciglia più realistica
      const curveFactor = point.length / 15; // Curva proporzionale alla lunghezza
      const controlX = point.x + Math.cos(angleRad) * (lashLength * 0.7);
      const controlY = point.y + Math.sin(angleRad) * (lashLength * 0.7) - (3 * curveFactor);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.stroke();

      // Reset shadow per il punto
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Colore del punto in base allo stato con migliori feedback visivi
      let pointColor = '#6b7280';
      let pointBorderColor = '#9ca3af';
      
      if (isRepositionMode) {
        pointColor = isDragged ? '#dc2626' : '#f59e0b';
        pointBorderColor = isDragged ? '#b91c1c' : '#d97706';
      } else if (isSelected) {
        pointColor = colors.primary;
        pointBorderColor = colors.primaryDark || colors.primary;
      } else if (isHovered) {
        pointColor = colors.primaryLight;
        pointBorderColor = colors.primary;
      }

      // Disegna il punto con bordo e effetto glow migliorato
      const pointRadius = 6 * scale;
      
      // Glow effect per stati attivi
      if (isSelected || isHovered || isDragged) {
        ctx.shadowColor = pointColor + '80';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // Bordo del punto
      ctx.fillStyle = pointBorderColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointRadius + 1, 0, 2 * Math.PI);
      ctx.fill();

      // Punto principale
      ctx.fillStyle = pointColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Punto centrale bianco per contrasto
      if (isSelected || isHovered) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius * 0.3, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Etichetta lunghezza con background migliorato
      if ((isSelected || isHovered) && !isRepositionMode) {
        const text = `${point.length}mm`;
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 14;
        
        // Posizione etichetta dinamica per evitare sovrapposizioni
        const labelX = point.x;
        const labelY = point.y - 30;
        
        // Background dell'etichetta con shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = isSelected ? colors.primary : colors.primaryLight;
        ctx.beginPath();
        ctx.roundRect(labelX - textWidth/2 - 8, labelY - textHeight/2 - 4, textWidth + 16, textHeight + 8, 12);
        ctx.fill();

        // Piccola freccia che punta al punto
        ctx.beginPath();
        ctx.moveTo(labelX - 4, labelY + textHeight/2 + 4);
        ctx.lineTo(labelX + 4, labelY + textHeight/2 + 4);
        ctx.lineTo(labelX, labelY + textHeight/2 + 8);
        ctx.closePath();
        ctx.fill();

        // Reset shadow per il testo
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Testo con migliore leggibilità
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, labelX, labelY);
      }

      // Indicatore di riposizionamento migliorato
      if (isRepositionMode && !isDragged) {
        // Cerchio animato tratteggiato
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = Date.now() * 0.01 % 10; // Animazione del tratteggio
        ctx.beginPath();
        ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Piccole maniglie di trascinamento
        const handleSize = 3;
        ctx.fillStyle = '#f59e0b';
        [-1, 1].forEach(xDir => {
          [-1, 1].forEach(yDir => {
            ctx.beginPath();
            ctx.arc(point.x + xDir * 10, point.y + yDir * 10, handleSize, 0, 2 * Math.PI);
            ctx.fill();
          });
        });
      }

      // Indicatore di trascinamento attivo
      if (isDragged) {
        // Cerchio pulsante rosso
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.008);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 15, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
  }, [canvasSize, points, selectedPoint, hoveredPoint, draggedPoint, isRepositionMode, colors, backgroundImage]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (event.clientY - rect.top) * (canvasSize.height / rect.height);

    let closestPoint: EyePoint | null = null;
    let minDistance = Infinity;

    for (const point of points) {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      if (distance < minDistance && distance < 25) {
        minDistance = distance;
        closestPoint = point;
      }
    }

    setSelectedPoint(closestPoint ? closestPoint.id : null);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (event.clientY - rect.top) * (canvasSize.height / rect.height);

    let closestPoint: EyePoint | null = null;
    let minDistance = Infinity;

    for (const point of points) {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      if (distance < minDistance && distance < 25) {
        minDistance = distance;
        closestPoint = point;
      }
    }

    setHoveredPoint(closestPoint ? closestPoint.id : null);
  };

  const handleLengthChange = (pointId: string, length: number) => {
    const clampedLength = Math.max(5, Math.min(20, length));
    const updatedPoints = points.map(point => 
      point.id === pointId ? { ...point, length: clampedLength } : point
    );
    setPoints(updatedPoints);

    const newValue = { ...value, [pointId]: clampedLength };
    onChange(newValue);
  };

  const resetToDefaults = () => {
    const defaultLengths = {
      // Occhio sinistro
      left_inner_corner: 8,
      left_upper_inner: 9,
      left_upper_mid_inner: 10,
      left_upper_center: 11,
      left_upper_outer: 12,
      left_outer_corner: 10,
      left_lower_outer: 9,
      left_lower_center: 8,
      left_lower_mid_inner: 8,
      left_lower_inner: 8,
      // Occhio destro
      right_inner_corner: 8,
      right_upper_inner: 9,
      right_upper_mid_inner: 10,
      right_upper_center: 11,
      right_upper_outer: 12,
      right_outer_corner: 10,
      right_lower_outer: 9,
      right_lower_center: 8,
      right_lower_mid_inner: 8,
      right_lower_inner: 8,
    };
    onChange(defaultLengths);
  };


  const selectedPointData = points.find(p => p.id === selectedPoint);

  return (
    <div className={`space-y-6 ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${colors.bgGradient} rounded-2xl flex items-center justify-center shadow-lg`}>
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Schema Ciglia
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personalizza le lunghezze per ogni zona
            </p>
          </div>
        </div>
        
      </div>

      {/* Canvas Container */}
      <div className="relative">
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg flex items-center justify-center">
          {backgroundImage ? (
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              style={{ width: 500, height: 500 }}
              className="w-full cursor-pointer"
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => {
                setHoveredPoint(null);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
              Caricamento immagine...
            </div>
          )}
        </div>
        
        {/* Floating tooltip for hovered point */}
        {hoveredPoint && !selectedPoint && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              isRepositionMode ? setDraggedPoint(hoveredPoint) : setSelectedPoint(hoveredPoint);
            }}
            className={`absolute top-4 left-4 backdrop-blur-sm text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl border transition-colors z-10 cursor-pointer ${
              isRepositionMode 
                ? 'bg-orange-500/95 border-orange-400/50 hover:bg-orange-600/95' 
                : 'bg-gray-900/95 dark:bg-gray-800/95 border-gray-700/50 dark:border-gray-600/50 hover:bg-gray-800/95 dark:hover:bg-gray-700/95'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                isRepositionMode ? 'bg-orange-300' : 'bg-pink-400'
              }`}></div>
              <span className="font-medium">
                {pointLabels[hoveredPoint]}
              </span>
              <span className="text-gray-300 dark:text-gray-400">•</span>
              {isRepositionMode ? (
                <span className="font-bold text-orange-200">
                  Trascina per riposizionare
                </span>
              ) : (
                <span className="font-bold text-pink-300">
                  {points.find(p => p.id === hoveredPoint)?.length}mm
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Control Panel */}
      {selectedPointData && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {selectedPointData.label}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Regola la lunghezza delle ciglia
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPoint(null);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lunghezza
                </span>
                <span className={`text-sm font-bold ${colors.textPrimary} dark:${colors.textPrimaryDark}`}>
                  {selectedPointData.length}mm
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="0.5"
                  value={selectedPointData.length}
                  onChange={(e) => handleLengthChange(selectedPoint!, parseFloat(e.target.value))}
                  className={`w-full h-2 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-lg appearance-none cursor-pointer slider`}
                  style={{
                    background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${((selectedPointData.length - 5) / 15) * 100}%, #e5e7eb ${((selectedPointData.length - 5) / 15) * 100}%, #e5e7eb 100%)`
                  }}
                />
              </div>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLengthChange(selectedPoint!, selectedPointData.length - 0.5);
                }}
                disabled={selectedPointData.length <= 5}
                className={`p-2 rounded-xl border-2 ${colors.borderPrimary} dark:border-gray-600 ${colors.textPrimary} dark:${colors.textPrimaryDark} hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl min-w-[80px] text-center">
                <span className="text-sm font-mono text-gray-900 dark:text-white">
                  {selectedPointData.length}mm
                </span>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLengthChange(selectedPoint!, selectedPointData.length + 0.5);
                }}
                disabled={selectedPointData.length >= 20}
                className={`p-2 rounded-xl border-2 ${colors.borderPrimary} dark:border-gray-600 ${colors.textPrimary} dark:${colors.textPrimaryDark} hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Overview */}
      {!selectedPoint && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {points.map((point) => (
            <button
              key={point.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPoint(point.id);
              }}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
            >
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {point.label}
              </div>
              <div className={`text-sm font-bold ${colors.textPrimary} dark:${colors.textPrimaryDark}`}>
                {point.length}mm
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EyeSchemaCanvas;
