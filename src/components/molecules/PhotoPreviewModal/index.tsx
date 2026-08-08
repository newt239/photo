import { Modal } from "@mantine/core";

type PhotoPreviewModalProps = {
  photo: { name: string; url: string } | null;
  onClose: () => void;
};

export const PhotoPreviewModal = ({ photo, onClose }: PhotoPreviewModalProps) => (
  <Modal opened={photo !== null} onClose={onClose} title={photo?.name} size="xl" centered>
    {photo && (
      <img
        src={photo.url}
        alt={photo.name}
        style={{
          borderRadius: 8,
          display: "block",
          height: "auto",
          margin: "0 auto",
          maxHeight: "75vh",
          maxWidth: "100%",
        }}
      />
    )}
  </Modal>
);
