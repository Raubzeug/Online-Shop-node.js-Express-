const deleteProduct = (btn) => {
  const productId = btn.parentNode.querySelector("[name=productId]").value;
  const csrfToken = btn.parentNode.querySelector("[name=_csrf]").value;
  const productElement = btn.closest("article");
  fetch("/admin/delete-product/" + productId, {
    method: "delete",
    headers: {
      "csrf-token": csrfToken,
    },
  })
    .then((result) => {
      productElement.remove();
      return result.json();
    })
    .then((data) => console.log(data))
    .catch((err) => console.log(err));
};
