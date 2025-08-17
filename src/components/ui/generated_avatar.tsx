import { createAvatar } from '@dicebear/core';
import { lorelei, botttsNeutral, initials, dylan } from '@dicebear/collection';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from '@/lib/utils';


interface prop{
    seed: string;
    className?: string;
    variant: "lorelei" | "botttsNeutral" | "initials" | "dylan"
}

export function GeneratedAvatarProp({seed, className, variant}: prop){
    let avatar;
    if(variant === "initials"){
        avatar = createAvatar(initials, {
            seed,
            fontWeight: 500,
            fontSize: 42,
        });
    }else if(variant === "botttsNeutral"){
        avatar = createAvatar(botttsNeutral, {
            seed
        });
    }else if(variant === "dylan"){
        avatar = createAvatar(dylan, {
            seed
        });
    }else{
        avatar = createAvatar(lorelei, {
            seed
        });
    }

    return(
        <Avatar className={cn(className)}>
            <AvatarImage src={avatar.toDataUri()} alt='Avatar'/>
            <AvatarFallback>{seed.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
    )

}
