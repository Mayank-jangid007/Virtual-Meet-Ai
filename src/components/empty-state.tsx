import Image from "next/image"

interface Prop {
    title: string,
    description: string
}

export const EmptyState = ({ title, description }: Prop) => {

    return (


        <div className="flex flex-col items-center justify-center">
            <Image src='/empty.svg' alt='Empty' width={240} height={240} />
            <div className="flex flex-col gap-y-2 max-w-md mx-auto text-center text-center">
                <h6 className="text-lg font-medium">{title}</h6>
                <p className="text-sm">{description}</p>
            </div>
        </div>
    ) 
}