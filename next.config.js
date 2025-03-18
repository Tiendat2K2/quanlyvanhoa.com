module.exports = {
    async rewrites() {
      return [
        {
          source: "/static/*",
          destination: "/public/static/:path*", // hoặc một đường dẫn khác
        },
      ];
    },
  };
  
