import { useState, useRef } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'

interface PortfolioImage {
    id: number
    url: string
    caption?: string
    category: 'work' | 'before_after' | 'certification'
}

interface PortfolioGalleryProps {
    images: PortfolioImage[]
    onUpload?: (files: FileList) => void
    onDelete?: (id: number) => void
    editable?: boolean
}

export const PortfolioGallery = ({
    images,
    onUpload,
    onDelete,
    editable = false,
}: PortfolioGalleryProps) => {
    const [selectedImage, setSelectedImage] = useState<PortfolioImage | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && onUpload) {
            onUpload(e.target.files)
            // Reset input so the same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="space-y-4">
            {editable && (
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary">Work Portfolio</h3>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <Button type="button" size="sm" onClick={handleUploadClick}>
                            <span className="material-symbols-outlined text-sm mr-2">add_photo_alternate</span>
                            Upload Photos
                        </Button>
                    </div>
                </div>
            )}

            {images.length === 0 ? (
                <Card className="p-12 text-center border-2 border-dashed">
                    <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-text-muted">
                            photo_library
                        </span>
                        <p className="text-text-secondary">No portfolio images yet</p>
                        {editable && (
                            <p className="text-sm text-text-muted">
                                Upload photos of your work to showcase your skills
                            </p>
                        )}
                    </div>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer border border-border hover:border-primary transition-colors"
                                onClick={() => setSelectedImage(image)}
                            >
                                <img
                                    src={image.url}
                                    alt={image.caption || 'Portfolio image'}
                                    className="w-full h-full object-cover"
                                />
                                {editable && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete?.(image.id)
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </Button>
                                    </div>
                                )}
                                {image.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                        <p className="text-white text-sm line-clamp-2">{image.caption}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Lightbox Modal */}
                    {selectedImage && (
                        <div
                            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                            onClick={() => setSelectedImage(null)}
                        >
                            <div className="relative max-w-4xl max-h-[90vh]">
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-12 right-0 text-white hover:text-gray-300"
                                >
                                    <span className="material-symbols-outlined text-3xl">close</span>
                                </button>
                                <img
                                    src={selectedImage.url}
                                    alt={selectedImage.caption || 'Portfolio image'}
                                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                                />
                                {selectedImage.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 rounded-b-lg">
                                        <p className="text-white">{selectedImage.caption}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
