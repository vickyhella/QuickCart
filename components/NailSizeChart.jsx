import React from 'react'
import chart from '@/config/nail-size-chart.json'

export default function NailSizeChart({ selectedSize = '' }) {
  return (
    <div role="region" aria-label="Nail size chart" tabIndex={0} className="mt-4 max-w-full overflow-x-auto rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#704576]">
      <table className="w-full min-w-[340px] border-collapse text-center text-xs sm:text-sm">
        <caption className="pb-2 text-left text-xs text-[#6e5c55]">Nail widths in millimeters (mm)</caption>
        <thead className="bg-[#eee5f2] text-[#473545]">
          <tr>{chart.columns.map((column) => <th key={column} scope="col" className="border border-[#dfd1df] px-2 py-2.5 font-semibold">{column}</th>)}</tr>
        </thead>
        <tbody>
          {chart.rows.map(([size, ...widths]) => <tr key={size} className={String(size).toLowerCase() === selectedSize.toLowerCase() ? 'bg-[#eee5f2] font-semibold text-[#704576]' : 'bg-[#fffdfa] text-[#554944]'}>
            <th scope="row" className="border border-[#dfd1df] px-2 py-2.5 font-semibold">{size}</th>
            {widths.map((width, index) => <td key={chart.columns[index + 1]} className="border border-[#dfd1df] px-2 py-2.5">{width}</td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
  )
}
