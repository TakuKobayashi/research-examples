import { Suspense } from 'react';

import RoomsListView from '@/components/RoomsListView';

export default function RoomsPage() {
  return (
    <Suspense fallback={null}>
      <RoomsListView />
    </Suspense>
  );
}
