const SystemFeatures = () => {
  return (
    <div className="h-[calc(100vh-64px-48px-56px-56px)]">
      <iframe src={`${import.meta.env.VITE_H5_SITE_URL}/system-features`} width="100%" height="100%" frameBorder="0"></iframe>
    </div>
  )
}

export default SystemFeatures