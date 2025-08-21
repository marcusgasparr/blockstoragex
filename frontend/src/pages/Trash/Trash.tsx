import React from "react";
import styles from "./Trash.module.scss";

const Trash: React.FC = () => {
  return (
    <div className={styles.trash}>
      <h1>Lixeira</h1>
      {/* Adicione a lista de arquivos excluídos recentemente aqui */}
    </div>
  );
};

export default Trash;
