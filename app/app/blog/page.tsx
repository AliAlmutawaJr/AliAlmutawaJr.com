import Link from "next/link";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";

// Sample blog posts data. In a real app, you can fetch this from a file or CMS.
const posts = [
  { id: "1", title: "The Namespace Problem"},
  { id: "2", title: "Pie's Type System" },
  { id: "3", title: "The Evolution of Pattern Matching in Pie" },
];

export default function Blog() {
  return (
    <>
    <Header />

    <div className="w-full p-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
        {posts.map((post) => (
          <div key={post.id} className="w-full">
            <Link href={`/blog/post${post.id}`}>
              <div className="block">
                <img src={`/images/post${post.id}.png`} alt={post.title} className="w-full h-auto mb-4" />
                <h3 className="text-center">{post.title}</h3>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>

        <Footer />
    </>
  );
}
  