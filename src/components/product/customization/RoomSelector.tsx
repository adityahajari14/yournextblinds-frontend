'use client';

import Image from 'next/image';
import { Room } from '@/types';

interface RoomSelectorProps {
  rooms: Room[];
  selectedRoom: string | null;
  onRoomChange: (roomId: string) => void;
}

const RoomSelector = ({ rooms, selectedRoom, onRoomChange }: RoomSelectorProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-black">Choose Your Room</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onRoomChange(room.id)}
            className={`flex flex-col items-center justify-center p-3 border border-solid transition-all h-[133px] ${
              selectedRoom === room.id
                ? 'border-[#00473c] bg-[#f6fffd]'
                : 'border-[#d9d9d9] hover:border-[#00473c]/50 bg-white'
            }`}
          >
            <div className="flex-1 flex items-center justify-center mb-3">
              <Image
                src={room.icon}
                alt={room.name}
                width={76}
                height={76}
                className="object-contain max-h-[70px]"
              />
            </div>
            <span className="text-xs text-black text-center leading-normal">{room.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomSelector;
