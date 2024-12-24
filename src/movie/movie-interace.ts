interface FFprobeMetadata {
  format: {
    duration: number;
  };
  streams: {
    width: number;
    height: number;
  }[];
}

export default FFprobeMetadata;
