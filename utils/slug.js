import slugify from "slugify";
import Product from "../models/productModel.js";

const generateUniqueSlug = async (name, currentId = null) => {
  const baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;

  while (
    await Product.findOne({
      slug,
      ...(currentId && { _id: { $ne: currentId } }),
    })
  ) {
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
};

export default generateUniqueSlug;
