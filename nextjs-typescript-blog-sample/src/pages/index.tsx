import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import fs from 'fs';
import matter from 'gray-matter';
import Link from 'next/link';

export const getStaticProps = () => {
  const files = fs.readdirSync('posts');
  const posts = files.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fileContent = fs.readFileSync(`posts/${fileName}`, 'utf-8');
    const { data, content } = matter(fileContent);
    return {
      frontMatter: data,
      content,
      slug,
    };
  });
  return {
    props: {
      posts: posts,
    },
  };
};

export default function Home({ posts }) {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="my-8">
        {posts.map((post) => (
          <div key={post.slug}>
            <Link href={`/posts/${post.slug}`}>
              {post.frontMatter.title}
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}
