import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://halicexamgenius.com/",
      lastModified: new Date(),
    },
  ];
}
