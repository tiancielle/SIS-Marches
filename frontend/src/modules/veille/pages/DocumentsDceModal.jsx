import React from "react";
import Modal from "../../../components/ui/Modal";
import DocumentsDceList from "./DocumentsDceList";

export default function DocumentsDceModal({ documents, loading, appelOffresId, onClose }) {
  return (
    <Modal title="Documents indexés" onClose={onClose}>
      <DocumentsDceList documents={documents} loading={loading} appelOffresId={appelOffresId} />
    </Modal>
  );
}