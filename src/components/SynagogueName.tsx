
import React from 'react';
import { useBoardSettings } from '../hooks/useBoardSettings';

interface SynagogueNameProps {
  synagogueId: string;
}

const SynagogueName: React.FC<SynagogueNameProps> = ({ synagogueId }) => {
  const { settings } = useBoardSettings(synagogueId);
  return <>{settings.boardTitle || synagogueId}</>;
};

export default SynagogueName;
