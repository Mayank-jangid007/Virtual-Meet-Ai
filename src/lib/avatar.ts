import {  botttsNeutral, initials } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';

interface prop{
    seed: string;
    variant: "lorelei" | "botttsNeutral" | "initials" | "dylan"
}

export function GeneratedAvatarUri({ seed, variant }: prop){
    let avatar;

        if(variant === "botttsNeutral"){
            avatar = createAvatar(botttsNeutral, { seed,});
        } else {  
            avatar = createAvatar(initials, { seed, fontWeight: 500, fontSize: 42 });
        }
        return avatar.toDataUri();
    }
