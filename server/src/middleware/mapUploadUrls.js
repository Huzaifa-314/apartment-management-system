export function mapUploadUrls(subdir) {
  return (req, res, next) => {
    req.fileUrls = {};
    if (!req.files) return next();
    const files = req.files;
    const add = (field) => {
      const arr = files[field];
      if (arr?.[0]) {
        req.fileUrls[field] = `/uploads/${subdir}/${arr[0].filename}`;
      }
    };
    add('profilePicture');
    add('voterId');
    add('aadharCard');
    add('leaseAgreement');
    add('incomeProof');
    next();
  };
}
