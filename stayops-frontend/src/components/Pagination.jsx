import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { currentPage, totalPages, totalItems, pageSize } = pagination;
  
  // Calculate display range
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderTop: 'none',
      borderBottomLeftRadius: '12px',
      borderBottomRightRadius: '12px',
    }}>
      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
        Showing <span style={{ fontWeight: '600', color: '#0f172a' }}>{startItem}</span> to <span style={{ fontWeight: '600', color: '#0f172a' }}>{endItem}</span> of <span style={{ fontWeight: '600', color: '#0f172a' }}>{totalItems}</span> results
      </div>

      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.4rem',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            background: currentPage === 1 ? '#f8fafc' : '#fff',
            color: currentPage === 1 ? '#cbd5e1' : '#475569',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = idx + 1;
          // Simple logic to show limited pages if there are too many
          if (totalPages > 5) {
            if (
              pageNum !== 1 &&
              pageNum !== totalPages &&
              Math.abs(currentPage - pageNum) > 1
            ) {
              if (Math.abs(currentPage - pageNum) === 2) {
                return <span key={pageNum} style={{ padding: '0.4rem', color: '#cbd5e1' }}>...</span>;
              }
              return null;
            }
          }

          const isActive = currentPage === pageNum;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              style={{
                minWidth: '32px',
                padding: '0.4rem',
                border: isActive ? '1px solid #faab36' : '1px solid #e2e8f0',
                borderRadius: '6px',
                background: isActive ? '#fffbeb' : '#fff',
                color: isActive ? '#b45309' : '#475569',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.4rem',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            background: currentPage === totalPages ? '#f8fafc' : '#fff',
            color: currentPage === totalPages ? '#cbd5e1' : '#475569',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
