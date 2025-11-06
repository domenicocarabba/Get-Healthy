// components/HeaderLogo.jsx
import Image from "next/image";
import logo from "@/public/logo.png"; // <-- prende /public/logo.png

export default function HeaderLogo() {
    return (
        <Image
            src={logo}
            alt="Get Healthy logo"
            width={64}
            height={64}
            priority
            placeholder="empty"
        />
    );
}
