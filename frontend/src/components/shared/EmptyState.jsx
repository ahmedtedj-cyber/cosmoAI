import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-border rounded-2xl bg-card/40">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-accent-foreground" />
        </div>
      )}
      <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}