import { Inter } from "next/font/google";
import Head from "next/head";
import ChatLayout from "@/components/ChatLayout";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <>
      <Head>
        <title>DevAssist Bot</title>
        <meta name="description" content="Intelligent assistant for automating development tasks" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${inter.className} h-screen`}>
        <ChatLayout />
      </main>
    </>
  );
}
