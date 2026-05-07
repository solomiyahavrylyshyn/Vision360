import { useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";

const ITEM_TYPE = "COL_HEADER";

type ColDef = { key: string; label: string; [k: string]: unknown };

/** Returns ordered column list + a swap function */
export function useDraggableColumns<T extends ColDef>(initial: T[]) {
  const [cols, setCols] = useState<T[]>(initial);
  const move = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    setCols(prev => {
      const next = [...prev];
      const from = next.findIndex(c => c.key === fromKey);
      const to   = next.findIndex(c => c.key === toKey);
      if (from < 0 || to < 0) return prev;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };
  return [cols, move] as const;
}

type DraggableThProps = {
  colKey: string;
  onMove: (from: string, to: string) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

/** Drop target + drag source table header cell */
export function DraggableTh({ colKey, onMove, children, className = "", style, onClick }: DraggableThProps) {
  const ref = useRef<HTMLTableCellElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { key: colKey },
    collect: m => ({ isDragging: m.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop<{ key: string }, void, { isOver: boolean }>({
    accept: ITEM_TYPE,
    drop: ({ key }) => onMove(key, colKey),
    collect: m => ({ isOver: m.isOver() }),
  });

  drag(drop(ref));

  return (
    <th
      ref={ref}
      onClick={onClick}
      className={`${className} ${isOver ? "bg-[#EBF2FF]" : ""}`}
      style={{
        ...style,
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        position: "relative",
      }}
    >
      {/* left drop indicator */}
      {isOver && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: "#4A6FA5",
            borderRadius: 2,
            pointerEvents: "none",
          }}
        />
      )}
      {children}
    </th>
  );
}
