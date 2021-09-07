module.exports = {
  webpack: (config) => {
    config.node = {
      webpack5: false,
      fs: 'empty'
    }
    return config
  },
  assetPrefix: './',
};
