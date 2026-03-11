'use client';

import { motion } from 'framer-motion';

interface VideoEmbedProps {
  url: string;
  className?: string;
}

export default function VideoEmbed({ url, className = '' }: VideoEmbedProps) {
  const getEmbedUrl = (videoUrl: string): { type: 'youtube' | 'vimeo' | 'direct'; embedUrl: string } | null => {
    // YouTube patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = videoUrl.match(youtubeRegex);
    if (youtubeMatch) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`,
      };
    }

    // Vimeo patterns
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = videoUrl.match(vimeoRegex);
    if (vimeoMatch) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`,
      };
    }

    // Direct video URL (mp4, webm, etc.)
    if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
      return {
        type: 'direct',
        embedUrl: videoUrl,
      };
    }

    return null;
  };

  const videoData = getEmbedUrl(url);

  if (!videoData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full ${className}`}
    >
      <div className="relative w-full overflow-hidden rounded-xl shadow-2xl ring-2 ring-white/20" style={{ paddingBottom: '56.25%' }}>
        {videoData.type === 'direct' ? (
          <video
            src={videoData.embedUrl}
            controls
            className="absolute top-0 left-0 w-full h-full"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <iframe
            src={videoData.embedUrl}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Event Video"
          />
        )}
      </div>
    </motion.div>
  );
}
