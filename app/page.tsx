'use client';

import { useState } from 'react';
import { GroupList } from '@/components/GroupList';
import { GroupDetail } from '@/components/GroupDetail';
import { Toaster } from '@/components/ui/toaster';
import { useGroups } from '@/hooks/useGroups';
import { Group } from '@/lib/types';

export default function Home() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const {
    groups,
    addGroup,
    deleteGroup,
    addMember,
    updateMember,
    deleteMember,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useGroups();

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
  };

  const handleBack = () => {
    setSelectedGroup(null);
  };

  // Refresh selected group data when groups change
  const getUpdatedGroup = (groupId: string) => {
    return groups.find(g => g.id === groupId) || null;
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto min-h-screen bg-background">
        <div className="p-4 pb-24">
          {selectedGroup ? (
            <GroupDetail
              group={getUpdatedGroup(selectedGroup.id) || selectedGroup}
              onBack={handleBack}
              onUpdateGroup={() => {}}
              onAddMember={addMember}
              onUpdateMember={updateMember}
              onDeleteMember={deleteMember}
              onAddTransaction={addTransaction}
              onUpdateTransaction={updateTransaction}
              onDeleteTransaction={deleteTransaction}
            />
          ) : (
            <GroupList
              groups={groups}
              onAddGroup={addGroup}
              onDeleteGroup={deleteGroup}
              onSelectGroup={handleSelectGroup}
            />
          )}
        </div>
      </div>
      <Toaster />
    </main>
  );
}
